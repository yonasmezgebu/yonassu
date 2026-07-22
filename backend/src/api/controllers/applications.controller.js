const { db } = require('../../config/database');
const { sendNotification } = require('../../services/notification.service');

exports.submitApplication = async (req, res) => {
  try {
    const { post_id, full_name, phone_number, email, education_status, national_id, sex } = req.body;

    if (!post_id || !full_name || !phone_number || !email || !education_status || !national_id || !sex) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const [id] = await db('job_applications').insert({
      post_id,
      full_name,
      phone_number,
      email,
      education_status,
      national_id,
      sex,
      status: 'PENDING'
    }).returning('id');

    const insertedId = id.id || id;

    // Fetch post details for notification
    const post = await db('news_posts').where({ id: post_id }).first();
    const positionName = post?.hiring_position || post?.title || 'Open Position';

    // Notify HR (non-blocking)
    sendNotification('HR Manager', null, {
      title: 'New Job Application',
      message: `${full_name} applied for ${positionName}`,
      type: 'job_application',
      link: '/hr/applications',
      related_entity_id: insertedId
    }).catch(err => console.error('[Notification] Failed to notify HR:', err.message));

    console.log(`[Job Application] New application from ${full_name} (${email}) for post ${post_id}`);

    // NOTE: Email is sent via mailto: links in the HR dashboard (no backend email integration)
    res.status(201).json({ success: true, message: 'Application submitted successfully', id: insertedId });
  } catch (err) {
    console.error('Submit application error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};


exports.getApplications = async (req, res) => {
  try {
    const { status } = req.query;
    let query = db('job_applications')
      .leftJoin('news_posts', 'job_applications.post_id', 'news_posts.id')
      .select('job_applications.*', 'news_posts.title as post_title', 'news_posts.hiring_position')
      .orderBy('job_applications.created_at', 'desc');

    if (status) {
      query = query.where('job_applications.status', status);
    }

    const applications = await query;
    res.json(applications);
  } catch (err) {
    console.error('Get applications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    if (!['PENDING', 'IN_PERSON_INVITED', 'SUBMITTED_TO_CEO', 'REJECTED', 'APPROVED', 'INFORMED'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = { status, updated_at: db.fn.now() };
    if (reason && status === 'REJECTED') {
      updateData.rejection_reason = reason;
    }

    await db('job_applications').where({ id }).update(updateData);

    // If forwarded to CEO, send a notification to the CEO
    if (status === 'SUBMITTED_TO_CEO') {
      const appInfo = await db('job_applications')
        .join('news_posts', 'job_applications.post_id', 'news_posts.id')
        .where('job_applications.id', id)
        .select('job_applications.full_name', 'news_posts.hiring_position', 'news_posts.title')
        .first();

      if (appInfo) {
        const positionName = appInfo.hiring_position || appInfo.title || 'Open Position';
        sendNotification('CEO', null, {
          title: 'Candidate Shortlisted',
          message: `HR forwarded applicant ${appInfo.full_name} for ${positionName}`,
          type: 'job_application_forwarded',
          link: '/ceo/applicants', // Route to CEO Applicants
          related_entity_id: id
        }).catch(err => console.error('[Notification] Failed to notify CEO:', err.message));
      }
    }
    
    res.json({ success: true, message: 'Status updated' });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
